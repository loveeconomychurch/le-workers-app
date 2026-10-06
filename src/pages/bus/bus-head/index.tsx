/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from 'react'
import { Box, Flex, Skeleton, Text, useDisclosure } from '@chakra-ui/react'
import { IAccountUser, getUser } from '@/frontend/store/auth'
import { useRouter } from 'next/router'
import GuardWrapper from '@/frontend/components/layouts/guardWrapper'
import { saveActiveEvent } from '@/frontend/store/event'
import AppWrapper from '@/frontend/components/layouts/appWrapper'
import ZoneCard from '@/frontend/components/Bus/ZoneCard'
import { IBusRound } from '@/interface/bus'
import DeleteBusRound from '@/frontend/components/Modals/deleteBusRound'
import { saveExtraBusRecord } from '@/frontend/store/bus'
import { useBasePostQuery, useBaseGetQuery } from '@/frontend/apis/base'
import { IEvent } from '@/interface/events'
import dayjs from 'dayjs'

export default function BranchHead() {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [selectedBus, setSelectedBus] = useState<IBusRound>()
  const [currentUser, setCurrentUser] = useState<IAccountUser>()
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const router = useRouter()

  // GET PREVIOUS EVENTS LIST
  const { isLoading: eventsLoading, data: eventsData } = useBaseGetQuery<{
    id: string
    name: string
    start: string
    end: string
    timeSince: string
    live: boolean
    daysTo: number
  }[]>(
    'events/previous',
    {},
    {},
    !!currentUser?.currentRole?.groupId
  )

  // GET ACTIVE EVENT (shown when no historical event is selected)
  const { isLoading: eventLoading, data: eventData, error: eventError } = useBasePostQuery<IEvent>(
    'events/active',
    null,
    { group: currentUser?.currentRole?.groupId as string },
    !!currentUser?.currentRole?.groupId
  )

  // GET EVENT ZONE SUMMARY (always scoped to the active event via the backend)
  const { isLoading, data } = useBasePostQuery<{
    busInfo: { total_buses: number; arrived: number; on_route: number }
    peopleInfo: { people: number; arrived: number; on_route: number }
    financeInfo: { offering: number; cost: number }
    notStarted: string[]
    unMetTarget: string[]
    zones: Record<string, IBusRound[]>
  }>(
    `bus-rounds/zone-summary/${currentUser?.currentRole?.groupId as string}`,
    null,
    { group: currentUser?.currentRole?.groupId as string },
    !!currentUser?.currentRole?.groupId
  )

  useEffect(() => {
    if (eventData && !eventError) {
      saveActiveEvent(eventData?.data)
    }
  }, [eventData, eventError])

  useEffect(() => {
    const payload = {
      notStarted: data?.data.notStarted as string[],
      unMetTarget: data?.data.unMetTarget as string[],
    }
    saveExtraBusRecord(payload)
  }, [data?.data.unMetTarget, data?.data.notStarted])

  useEffect(() => {
    const user = getUser() as IAccountUser
    if (!user) router.push('/bus/login')
    setCurrentUser(user)
    saveExtraBusRecord({})
  }, [])

  // Determine which event name to display
  const displayEventName = selectedEventId
    ? eventsData?.data.find(e => e.id === selectedEventId)?.name
    : eventData?.data?.name

  return (
    <GuardWrapper allowed={['BUS_HEAD']} redirectTo='/bus/login' app='bus'>
      <AppWrapper>

        {/* ── Event Selection List ── */}
        <Box mt={4}>
          <Text fontWeight={600} color={'gray.500'} mb={2}>Events</Text>
          {eventsLoading ? <Skeleton h={16} rounded={'md'} w={'100%'} mb={4} /> : null}
          {eventsData?.data.map(item => (
            <Box
              key={item.id}
              borderColor={selectedEventId === item.id ? 'blue.400' : 'gray.100'}
              borderWidth={selectedEventId === item.id ? 2 : 1}
              rounded={'md'}
              p={3}
              mb={3}
              bg={selectedEventId === item.id ? 'blue.50' : 'gray.100'}
              cursor={'pointer'}
              onClick={() => setSelectedEventId(prev => prev === item.id ? null : item.id)}
            >
              <Flex justify={'space-between'} align={'center'}>
                <Text color={selectedEventId === item.id ? 'blue.600' : 'gray.500'} fontWeight={600} fontSize={14}>
                  {item.name}
                </Text>
                {item.daysTo < 0 ? (
                  <Flex align={'center'} gap={1}>
                    <Box rounded={'full'} boxSize={2} bg="yellow.400"></Box>
                    <Text color={'gray.400'} fontSize={12}>{item.timeSince}</Text>
                  </Flex>
                ) : item.daysTo > 0 ? (
                  <Flex align={'center'} gap={1}>
                    <Box rounded={'full'} boxSize={2} bg="red.400"></Box>
                    <Text color={'gray.400'} fontSize={12}>{item.timeSince}</Text>
                  </Flex>
                ) : (
                  <Flex align={'center'} gap={1}>
                    <Text color={'gray.400'} fontSize={12}>Active</Text>
                    <Box rounded={'full'} boxSize={2} bg="green.500"></Box>
                  </Flex>
                )}
              </Flex>
              <Flex color={'gray.400'} justify={'space-between'} fontSize={12} mt={1}>
                <Text><Text as="span" fontWeight={600}>Start</Text> {dayjs(item.start).format('D MMM YYYY')}</Text>
                <Text><Text as="span" fontWeight={600}>End</Text> {dayjs(item.end).format('D MMM YYYY')}</Text>
              </Flex>
            </Box>
          ))}
        </Box>

        {/* ── Active Event Summary (scoped to this bus head's group) ── */}
        <Flex mt={4} align={'center'} justify={'space-between'}>
          {!eventLoading
            ? <Text fontWeight={600} color="gray.500">{displayEventName}</Text>
            : <Skeleton h={6} w={'200px'} />}
        </Flex>

        <Box maxH={'calc(100vh - 150px)'} overflowY={'scroll'}>
          <Flex gap={3} mt={4}>
            {isLoading ? <Skeleton h={24} w="100%" rounded={'md'} /> : (
              <Box
                justifyContent={'space-between'}
                flex={1} p={2} rounded={'md'}
                bg="gray.100" borderWidth={1}
                borderColor={'gray.200'}
              >
                <Flex borderBottomWidth={1} borderColor={'gray.200'} w="100%" justifyContent={'space-between'}>
                  <Text fontSize={15} fontWeight={600} color={'gray.500'}>Total buses</Text>
                  <Text fontSize={16} fontWeight={600} color={'gray.500'} textAlign={'center'}>{data?.data?.busInfo?.total_buses || 0}</Text>
                </Flex>
                <Flex mt={1} w="100%" justifyContent={'space-between'}>
                  <Text fontSize={15} color={'gray.500'}>Bus arrived</Text>
                  <Text fontSize={16} fontWeight={600} color={'gray.500'} textAlign={'center'}>{data?.data.busInfo?.arrived || 0}</Text>
                </Flex>
                <Flex mt={1} w="100%" justifyContent={'space-between'}>
                  <Text fontSize={15} color={'gray.500'}>Incoming buses</Text>
                  <Text fontSize={16} fontWeight={600} color={'gray.500'} textAlign={'center'}>{data?.data?.busInfo?.on_route || 0}</Text>
                </Flex>
              </Box>
            )}

            {isLoading ? <Skeleton h={24} w="100%" rounded={'md'} /> : (
              <Box
                justifyContent={'space-between'}
                flex={1} p={2} rounded={'md'}
                bg="gray.100" borderWidth={1}
                borderColor={'gray.200'}
              >
                <Flex borderBottomWidth={1} borderColor={'gray.200'} w="100%" justifyContent={'space-between'}>
                  <Text fontSize={15} fontWeight={600} color={'gray.500'}>People Transported</Text>
                  <Text fontSize={16} fontWeight={600} color={'gray.500'} textAlign={'center'}>{data?.data?.peopleInfo?.people || 0}</Text>
                </Flex>
                <Flex mt={1} w="100%" justifyContent={'space-between'}>
                  <Text fontSize={15} color={'gray.500'}>People arrived</Text>
                  <Text fontSize={16} fontWeight={600} color={'gray.500'} textAlign={'center'}>{data?.data?.peopleInfo?.arrived}</Text>
                </Flex>
                <Flex mt={1} w="100%" justifyContent={'space-between'}>
                  <Text fontSize={15} color={'gray.500'}>People en route</Text>
                  <Text fontSize={16} fontWeight={600} color={'gray.500'} textAlign={'center'}>{data?.data?.peopleInfo?.on_route || 0}</Text>
                </Flex>
              </Box>
            )}
          </Flex>

          {isLoading ? <Skeleton mt={3} h={24} w="100%" rounded={'md'} /> : (
            <Box
              justifyContent={'space-between'}
              flex={1} p={2} rounded={'md'}
              bg="gray.100" borderWidth={1}
              borderColor={'gray.200'} mt={3}
            >
              <Flex borderBottomWidth={1} borderColor={'gray.200'} w="100%" justifyContent={'space-between'}>
                <Text fontSize={15} fontWeight={600} color={'gray.500'}>Finance Summary</Text>
              </Flex>
              <Flex mt={1} w="100%" justifyContent={'space-between'}>
                <Text fontSize={15} color={'gray.500'}>Bus Cost Accrued</Text>
                <Text fontSize={16} fontWeight={600} color={'gray.500'} textAlign={'center'}>Ghc {data?.data?.financeInfo?.cost || 0}</Text>
              </Flex>
              <Flex mt={1} w="100%" justifyContent={'space-between'}>
                <Text fontSize={15} color={'gray.500'}>Bus Offering Received</Text>
                <Text fontSize={16} fontWeight={600} color={'gray.500'} textAlign={'center'}>Ghc {data?.data?.financeInfo?.offering || 0}</Text>
              </Flex>
            </Box>
          )}

          <Flex gap={3}>
            {isLoading ? <Skeleton mt={3} h={12} w="100%" rounded={'md'} /> : (
              <Flex
                justifyContent={'space-between'}
                flex={1} p={2} rounded={'md'}
                bg="red.100" borderWidth={1}
                borderColor={'red.200'} mt={3}
                cursor={'pointer'}
                onClick={() => router.push('/bus/bus-head/no-activity')}
              >
                <Text fontSize={15} fontWeight={600} color={'red.400'}>No activity zones</Text>
                <Text fontSize={15} fontWeight={600} color={'red.400'}>{data?.data?.notStarted.length}</Text>
              </Flex>
            )}
            {isLoading ? <Skeleton mt={3} h={12} w="100%" rounded={'md'} /> : (
              <Flex
                justifyContent={'space-between'}
                flex={1} p={2} rounded={'md'}
                bg="orange.100" borderWidth={1}
                borderColor={'orange.200'} mt={3}
                cursor={'pointer'}
                onClick={() => router.push('/bus/bus-head/target')}
              >
                <Text fontSize={15} fontWeight={600} color={'orange.400'}>Target not met</Text>
                <Text fontSize={15} fontWeight={600} color={'orange.400'}>{data?.data?.unMetTarget?.length}</Text>
              </Flex>
            )}
          </Flex>

          <DeleteBusRound isOpen={isOpen} onClose={onClose} bus={selectedBus as IBusRound} />

          <Box py={6}>
            <Text fontWeight={600} color={'gray.500'}>Bus Zones</Text>
            {isLoading && <Skeleton w="100%" h={24} rounded="md" />}
            <Box>
              {!isLoading && Object.keys(data?.data.zones || {})?.map((item: string) => (
                <ZoneCard
                  key={item}
                  loading={isLoading}
                  data={data?.data?.zones[item] as IBusRound[]}
                  name={item}
                  setSelectedBus={setSelectedBus}
                  onOpen={onOpen}
                />
              ))}
            </Box>
          </Box>
        </Box>
      </AppWrapper>
    </GuardWrapper>
  )
}
